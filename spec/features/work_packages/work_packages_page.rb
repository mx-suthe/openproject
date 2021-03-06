#-- copyright
# OpenProject is a project management system.
# Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
# Copyright (C) 2006-2013 Jean-Philippe Lang
# Copyright (C) 2010-2013 the ChiliProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# See doc/COPYRIGHT.rdoc for more details.
#++

class WorkPackagesPage
  include Rails.application.routes.url_helpers
  include Capybara::DSL

  def initialize(project = nil)
    @project = project
  end

  def visit_index
    visit index_path
  end

  def visit_new
    visit new_project_work_package_path(@project)
  end

  def visit_show(id)
    visit work_package_path(id)
  end

  def visit_edit(id)
    visit edit_work_package_path(id)
  end

  def visit_calendar
    visit index_path + '/calendar'
  end

  def click_work_packages_menu_item
    find('#main-menu .work-packages').click
  end

  def click_toolbar_button(button)
    find('.toolbar-container').click_button button
  end

  def select_query(query)
    visit query_path(query)
  end

  def find_filter(filter_name)
    find(".advanced-filters--filters #filter_#{filter_name}")
  end

  private

  def index_path
    @project ? project_work_packages_path(@project) : work_packages_path
  end

  def query_path(query)
    "#{index_path}?query_id=#{query.id}"
  end
end
